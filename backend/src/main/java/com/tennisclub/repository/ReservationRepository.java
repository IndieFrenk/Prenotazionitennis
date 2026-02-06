package com.tennisclub.repository;

import com.tennisclub.model.Reservation;
import com.tennisclub.model.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link Reservation} entity.
 * Provides derived query methods for common lookups, as well as custom
 * JPQL queries for overlap detection, future-reservation counting, and
 * statistics aggregation.
 */
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

    // -----------------------------------------------------------------------
    // User-facing queries
    // -----------------------------------------------------------------------

    /**
     * Retrieve a paginated list of reservations for a given user, ordered by
     * reservation date (descending) and start time (descending).
     *
     * @param userId   the UUID of the user
     * @param pageable pagination and sorting information
     * @return a page of the user's reservations, most recent first
     */
    Page<Reservation> findByUserIdOrderByReservationDateDescStartTimeDesc(
            UUID userId, Pageable pageable);

    /**
     * Retrieve a paginated list of reservations for a given user. Sorting is
     * controlled entirely through the {@link Pageable} parameter.
     *
     * @param userId   the UUID of the user
     * @param pageable pagination and sorting information
     * @return a page of the user's reservations
     */
    Page<Reservation> findByUserId(UUID userId, Pageable pageable);

    // -----------------------------------------------------------------------
    // Court-day queries
    // -----------------------------------------------------------------------

    /**
     * Find all reservations for a specific court and date, excluding those with
     * a particular status (e.g. CANCELLATA).
     *
     * @param courtId the UUID of the court
     * @param date    the reservation date
     * @param status  the status to exclude
     * @return list of matching reservations
     */
    List<Reservation> findByCourtIdAndReservationDateAndStatusNot(
            UUID courtId, LocalDate date, ReservationStatus status);

    /**
     * Find all reservations for a specific court and date that have a given status.
     *
     * @param courtId the UUID of the court
     * @param date    the reservation date
     * @param status  the status to filter by
     * @return list of matching reservations
     */
    List<Reservation> findByCourtIdAndReservationDateAndStatus(
            UUID courtId, LocalDate date, ReservationStatus status);

    // -----------------------------------------------------------------------
    // Overlap detection
    // -----------------------------------------------------------------------

    /**
     * Check whether a confirmed reservation already exists on the same court and
     * date whose time slot overlaps with the given start/end time range.
     *
     * @param courtId   the UUID of the court
     * @param date      the reservation date
     * @param startTime the desired start time
     * @param endTime   the desired end time
     * @return true if an overlapping confirmed reservation exists
     */
    @Query("SELECT COUNT(r) > 0 FROM Reservation r " +
           "WHERE r.court.id = :courtId " +
           "AND r.reservationDate = :date " +
           "AND r.status = 'CONFERMATA' " +
           "AND r.startTime < :endTime " +
           "AND r.endTime > :startTime")
    boolean existsOverlappingReservation(
            @Param("courtId") UUID courtId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);

    /**
     * Same overlap check as {@link #existsOverlappingReservation}, but excludes a
     * specific reservation by its id. Used when updating an existing reservation so
     * that its own time slot does not cause a false overlap.
     *
     * @param courtId   the UUID of the court
     * @param date      the reservation date
     * @param startTime the desired start time
     * @param endTime   the desired end time
     * @param excludeId the UUID of the reservation to exclude from the check
     * @return true if an overlapping confirmed reservation (other than the excluded one) exists
     */
    @Query("SELECT COUNT(r) > 0 FROM Reservation r " +
           "WHERE r.court.id = :courtId " +
           "AND r.reservationDate = :date " +
           "AND r.status = 'CONFERMATA' " +
           "AND r.startTime < :endTime " +
           "AND r.endTime > :startTime " +
           "AND r.id != :excludeId")
    boolean existsOverlappingReservationExcluding(
            @Param("courtId") UUID courtId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") UUID excludeId);

    // -----------------------------------------------------------------------
    // Future reservation count
    // -----------------------------------------------------------------------

    /**
     * Count the number of confirmed reservations a user has in the future.
     * A reservation is considered "future" if its date is after today, or if its
     * date is today but its start time is after the current time.
     *
     * @param userId the UUID of the user
     * @param today  the current date
     * @param now    the current time
     * @return the number of future confirmed reservations for the user
     */
    @Query("SELECT COUNT(r) FROM Reservation r " +
           "WHERE r.user.id = :userId " +
           "AND r.status = 'CONFERMATA' " +
           "AND (r.reservationDate > :today " +
           "     OR (r.reservationDate = :today AND r.startTime > :now))")
    long countFutureConfirmedReservations(
            @Param("userId") UUID userId,
            @Param("today") LocalDate today,
            @Param("now") LocalTime now);

    // -----------------------------------------------------------------------
    // Statistics
    // -----------------------------------------------------------------------

    /**
     * Count reservations within a date range that have one of the given statuses.
     *
     * @param from     start date (inclusive)
     * @param to       end date (inclusive)
     * @param statuses the list of statuses to include
     * @return the reservation count
     */
    long countByReservationDateBetweenAndStatusIn(
            LocalDate from, LocalDate to, List<ReservationStatus> statuses);

    /**
     * Aggregate court usage statistics (reservation count and total revenue) grouped
     * by court, within a date range and filtered by statuses. Results are ordered by
     * reservation count descending.
     * <p>
     * Each {@code Object[]} in the returned list contains:
     * <ol>
     *   <li>{@code UUID}   - court id</li>
     *   <li>{@code String} - court name</li>
     *   <li>{@code Long}   - reservation count</li>
     *   <li>{@code BigDecimal} - total revenue (sum of paidPrice, zero if none)</li>
     * </ol>
     *
     * @param from     start date (inclusive)
     * @param to       end date (inclusive)
     * @param statuses the list of statuses to include
     * @return list of aggregated court usage rows
     */
    @Query("SELECT r.court.id, r.court.name, COUNT(r), COALESCE(SUM(r.paidPrice), 0) " +
           "FROM Reservation r " +
           "WHERE r.reservationDate BETWEEN :from AND :to " +
           "AND r.status IN :statuses " +
           "GROUP BY r.court.id, r.court.name " +
           "ORDER BY COUNT(r) DESC")
    List<Object[]> getCourtUsageStats(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("statuses") List<ReservationStatus> statuses);

    /**
     * Calculate the total revenue (sum of paid prices) for reservations within a
     * date range and filtered by statuses. Returns zero if no matching reservations exist.
     *
     * @param from     start date (inclusive)
     * @param to       end date (inclusive)
     * @param statuses the list of statuses to include
     * @return the total revenue as a BigDecimal
     */
    @Query("SELECT COALESCE(SUM(r.paidPrice), 0) " +
           "FROM Reservation r " +
           "WHERE r.reservationDate BETWEEN :from AND :to " +
           "AND r.status IN :statuses")
    BigDecimal getTotalRevenue(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("statuses") List<ReservationStatus> statuses);

    // -----------------------------------------------------------------------
    // Admin filtered search
    // -----------------------------------------------------------------------

    /**
     * Find reservations by date and status (paginated).
     *
     * @param date     the reservation date
     * @param status   the reservation status
     * @param pageable pagination and sorting information
     * @return a page of matching reservations
     */
    Page<Reservation> findByReservationDateAndStatus(
            LocalDate date, ReservationStatus status, Pageable pageable);

    /**
     * Find reservations by date (paginated).
     *
     * @param date     the reservation date
     * @param pageable pagination and sorting information
     * @return a page of matching reservations
     */
    Page<Reservation> findByReservationDate(LocalDate date, Pageable pageable);

    /**
     * Find reservations by status (paginated).
     *
     * @param status   the reservation status
     * @param pageable pagination and sorting information
     * @return a page of matching reservations
     */
    Page<Reservation> findByStatus(ReservationStatus status, Pageable pageable);

    /**
     * Find reservations by court (paginated).
     *
     * @param courtId  the UUID of the court
     * @param pageable pagination and sorting information
     * @return a page of matching reservations
     */
    Page<Reservation> findByCourtId(UUID courtId, Pageable pageable);
}
